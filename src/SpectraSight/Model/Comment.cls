Class SpectraSight.Model.Comment Extends SpectraSight.Model.Activity
{

Property Body As %String(%JSONFIELDNAME = "body", MAXLEN = 32000);

Storage Default
{
<Data name="CommentDefaultData">
<Subscript>"Comment"</Subscript>
<Value name="1">
<Value>Body</Value>
</Value>
</Data>
<DefaultData>CommentDefaultData</DefaultData>
<Type>%Storage.Persistent</Type>
}

}
