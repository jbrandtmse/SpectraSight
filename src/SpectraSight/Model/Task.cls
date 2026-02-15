Class SpectraSight.Model.Task Extends SpectraSight.Model.Ticket
{

Property EstimatedHours As %Numeric(%JSONFIELDNAME = "estimatedHours");

Property ActualHours As %Numeric(%JSONFIELDNAME = "actualHours");

Storage Default
{
<Data name="TaskDefaultData">
<Subscript>"Task"</Subscript>
<Value name="1">
<Value>EstimatedHours</Value>
</Value>
<Value name="2">
<Value>ActualHours</Value>
</Value>
</Data>
<DefaultData>TaskDefaultData</DefaultData>
<Type>%Storage.Persistent</Type>
}

}
